import sqlite3
import os
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "career_agent.db")

def get_db_connection():
    """Gets a SQLite connection with dict factory for ease of access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes database schema, tables, and indices if they do not exist."""
    logger.info(f"Initializing database at: {DB_PATH}")
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Create students table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        student_id TEXT PRIMARY KEY,
        firebase_uid TEXT UNIQUE NOT NULL,
        name TEXT,
        email TEXT,
        year INTEGER,
        branch TEXT,
        cgpa REAL,
        college TEXT,
        college_tier TEXT,
        domain_interest TEXT, -- JSON string array
        career_goal TEXT,
        hours_per_day INTEGER,
        preferred_style TEXT, -- JSON string array
        created_at TEXT
    );
    """)

    # 2. Create index on firebase_uid
    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_students_firebase_uid ON students(firebase_uid);
    """)

    # 3. Create skill_profiles table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS skill_profiles (
        student_id TEXT PRIMARY KEY,
        overall_score INTEGER,
        level TEXT,
        category_scores TEXT, -- JSON object string
        classification_reason TEXT,
        weak_areas TEXT, -- JSON string array
        summary_text TEXT,
        focus_areas TEXT, -- JSON string array
        recommended_next_step TEXT,
        overall_risk_level TEXT,
        risk_report TEXT, -- JSON object string
        created_at TEXT,
        FOREIGN KEY(student_id) REFERENCES students(student_id)
    );
    """)

    conn.commit()
    conn.close()
    logger.info("Database initialized successfully.")

# Run initialization
init_db()

def get_or_create_student_by_firebase_uid(firebase_uid: str, name: str, email: str) -> str:
    """Retrieves student_id for firebase_uid or creates a new student bare row, returning student_id."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if student already exists by firebase_uid
    cursor.execute("SELECT student_id FROM students WHERE firebase_uid = ?", (firebase_uid,))
    row = cursor.fetchone()
    if row:
        student_id = row["student_id"]
        conn.close()
        return student_id
        
    # Generate new student_id
    import uuid
    student_id = "stu-" + str(uuid.uuid4())
    
    cursor.execute("""
        INSERT INTO students (student_id, firebase_uid, name, email)
        VALUES (?, ?, ?, ?)
    """, (student_id, firebase_uid, name, email))
    
    conn.commit()
    conn.close()
    return student_id

