import math
import json
from typing import List, Dict, Any

from agents.base import BaseAgent
from models.quiz import QuizSubmission
from models.scoring import SkillProfileOutput, TopicScore, CategoryScores, DifficultyPerformance, DifficultyScoreDetail, BehaviouralSignals
from datetime import datetime

class ScoringAgent(BaseAgent):
    def __init__(self):
        # Temp 0.1 as specified in prompt document
        super().__init__(model_name="gemini-1.5-pro", temperature=0.1)

    def score_quiz(self, submission: QuizSubmission, year: int, primary_domain: str, career_goal: str) -> SkillProfileOutput:
        answers = submission.quiz_answers
        total_questions = len(answers)
        
        if total_questions == 0:
            # Fallback for empty submission
            return self._generate_mock(SkillProfileOutput)

        # 1. Topic-wise scores accumulation
        topic_data: Dict[str, Dict[str, int]] = {}
        for ans in answers:
            topic = ans.topic
            if topic not in topic_data:
                topic_data[topic] = {"correct": 0, "total": 0}
            topic_data[topic]["total"] += 1
            if ans.selected_option == ans.correct_option:
                topic_data[topic]["correct"] += 1

        topic_scores: Dict[str, TopicScore] = {}
        for topic, data in topic_data.items():
            percentage = int((data["correct"] / data["total"]) * 100)
            topic_scores[topic] = TopicScore(
                score=percentage,
                correct=data["correct"],
                total=data["total"]
            )

        # Helper category classifier
        dsa_topics = {
            "arrays", "strings", "sorting", "searching", "recursion", "linked lists", 
            "stacks/queues", "stacks", "queues", "trees", "graphs", "dynamic programming", 
            "greedy", "hashing", "heaps", "dsa", "recursion fundamentals", "linked list", "recursion/backtracking"
        }
        programming_topics = {
            "oop", "python", "java", "c++", "programming", "time/space complexity", 
            "bit manipulation", "oop concepts", "oop basics", "complexity analysis"
        }
        logic_topics = {
            "logic", "mathematical reasoning", "pattern recognition", "sequence puzzles", "logical reasoning"
        }

        # 2. Category-wise scores accumulation
        cat_data = {
            "dsa": {"correct": 0, "total": 0},
            "programming": {"correct": 0, "total": 0},
            "logic": {"correct": 0, "total": 0},
            "domain_specific": {"correct": 0, "total": 0}
        }

        # 3. Difficulty-wise performance accumulation
        diff_data = {
            "easy": {"correct": 0, "total": 0},
            "medium": {"correct": 0, "total": 0},
            "hard": {"correct": 0, "total": 0}
        }

        total_correct = 0
        total_time = submission.total_time_seconds
        
        for ans in answers:
            is_correct = ans.selected_option == ans.correct_option
            if is_correct:
                total_correct += 1

            # Determine category
            topic_lower = ans.topic.lower()
            if any(t in topic_lower for t in dsa_topics):
                cat = "dsa"
            elif any(t in topic_lower for t in programming_topics):
                cat = "programming"
            elif any(t in topic_lower for t in logic_topics):
                cat = "logic"
            else:
                cat = "domain_specific"
            
            cat_data[cat]["total"] += 1
            if is_correct:
                cat_data[cat]["correct"] += 1

            # Difficulty
            diff = ans.difficulty.lower()
            if diff in diff_data:
                diff_data[diff]["total"] += 1
                if is_correct:
                    diff_data[diff]["correct"] += 1

        # Calculate category percentages
        category_scores_dict = {}
        for cat, data in cat_data.items():
            if data["total"] > 0:
                category_scores_dict[cat] = int((data["correct"] / data["total"]) * 100)
            else:
                category_scores_dict[cat] = 0

        category_scores = CategoryScores(
            dsa=category_scores_dict["dsa"],
            programming=category_scores_dict["programming"],
            logic=category_scores_dict["logic"],
            domain_specific=category_scores_dict["domain_specific"]
        )

        # Calculate difficulty metrics
        diff_perf_dict = {}
        for diff, data in diff_data.items():
            pct = int((data["correct"] / data["total"]) * 100) if data["total"] > 0 else 0
            diff_perf_dict[diff] = DifficultyScoreDetail(
                correct=data["correct"],
                total=data["total"],
                percentage=pct
            )

        difficulty_performance = DifficultyPerformance(
            easy=diff_perf_dict["easy"],
            medium=diff_perf_dict["medium"],
            hard=diff_perf_dict["hard"]
        )

        # Calculate Overall Score (Weighted: DSA 40%, Programming 30%, Logic 20%, Domain 10%)
        weighted_score = (
            (category_scores.dsa * 0.40) +
            (category_scores.programming * 0.30) +
            (category_scores.logic * 0.20) +
            (category_scores.domain_specific * 0.10)
        )

        # Difficulty bonus: +3 pts per Hard question answered correctly (max +15)
        hard_correct = diff_data["hard"]["correct"]
        difficulty_bonus = min(hard_correct * 3, 15)

        # Time penalty: -2 pts if avg time per question > 90s
        avg_time = total_time / total_questions
        time_penalty = 2 if avg_time > 90 else 0

        overall_score = int(min(max(weighted_score + difficulty_bonus - time_penalty, 0), 100))

        # Calculate Medium/Hard percentage for advanced classification
        med_hard_correct = diff_data["medium"]["correct"] + diff_data["hard"]["correct"]
        med_hard_total = diff_data["medium"]["total"] + diff_data["hard"]["total"]
        med_hard_pct = int((med_hard_correct / med_hard_total) * 100) if med_hard_total > 0 else 0

        # Classification rules applied strictly in code (and passed to LLM to enforce)
        # Beginner: Overall score < 45, OR DSA category score < 30
        # Intermediate: Overall score 45-74, AND DSA score >= 40
        # Advanced: Overall score >= 75, AND Medium/Hard correct percentage >= 60%
        if overall_score >= 75 and med_hard_pct >= 60:
            computed_level = "Advanced"
        elif overall_score >= 45 and category_scores.dsa >= 40:
            computed_level = "Intermediate"
        else:
            computed_level = "Beginner"

        # Behavioural signals
        rushed = avg_time < 20.0
        
        # Consistent: true if std dev of topic scores < 15
        scores = [t.score for t in topic_scores.values()]
        if len(scores) > 1:
            mean = sum(scores) / len(scores)
            variance = sum((x - mean) ** 2 for x in scores) / len(scores)
            std_dev = math.sqrt(variance)
            consistent = std_dev < 15.0
        else:
            consistent = True

        struggled_on = [topic for topic, t in topic_scores.items() if t.score < 40]

        behavioural_signals = BehaviouralSignals(
            rushed=rushed,
            consistent=consistent,
            struggled_on=struggled_on
        )

        # Format details for LLM context call
        answers_summary = []
        for a in answers:
            answers_summary.append({
                "question_id": a.question_id,
                "topic": a.topic,
                "difficulty": a.difficulty,
                "is_correct": a.selected_option == a.correct_option,
                "time_taken": a.time_taken_seconds
            })

        system_instruction = (
            "You are a precise, analytical skill evaluator for an AI Career Agent.\n"
            "Score a student's quiz performance and classify their skill level.\n"
            "Validate and confirm the computed classification details. Frame your output context to be constructive and realistic.\n"
            "Return ONLY a valid JSON object matching the SkillProfileOutput schema.\n"
            "\n"
            "Mandatory Output Safety Rules:\n"
            "1. Return ONLY valid JSON - no markdown fences, no explanatory text outside the object.\n"
            "2. Apply classification rules strictly - do not upgrade level based on intuition.\n"
            "3. 'classification_reason' must cite the specific scores that determined the level.\n"
            "4. Never include discouraging or judgemental language."
        )

        prompt = f"""
Review the following computed quiz results for a student in year {year} with goal '{career_goal}' in domain '{primary_domain}'.
Compute the descriptive classification details (strong_areas, weak_areas, classification_reason, and confidence score) matching the expected schema.

## Computed Rule-Based Metrics
- Overall Score: {overall_score}
- Computed Level: {computed_level}
- Category Scores: DSA={category_scores.dsa}%, Programming={category_scores.programming}%, Logic={category_scores.logic}%, Domain={category_scores.domain_specific}%
- Difficulty Performance: Easy={difficulty_performance.easy.percentage}%, Medium={difficulty_performance.medium.percentage}%, Hard={difficulty_performance.hard.percentage}%
- Behavioural: Rushed={rushed}, Consistent={consistent}, Struggled Topics={struggled_on}
- Average Time per Question: {avg_time:.2f} seconds

## Per-Question Breakdown
{json.dumps(answers_summary, indent=2)}

Please populate the exact JSON response. Enforce the level to be exactly '{computed_level}'.
"""

        # Ask Gemini to fill in classification_reason, strong_areas, weak_areas and confidence
        # while matching the structured schema
        result = self.generate(prompt=prompt, schema=SkillProfileOutput, system_instruction=system_instruction)
        
        # Override rules in result to guarantee absolute correctness and compliance with rule-based thresholds
        result.student_id = submission.student_id
        result.overall_score = overall_score
        result.level = computed_level
        result.category_scores = category_scores
        result.difficulty_performance = difficulty_performance
        result.behavioural_signals = behavioural_signals
        result.avg_time_per_question_seconds = float(round(avg_time, 2))
        result.classified_at = datetime.utcnow()
        
        return result
