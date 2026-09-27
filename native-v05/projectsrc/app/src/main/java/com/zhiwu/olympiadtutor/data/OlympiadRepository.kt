package com.zhiwu.olympiadtutor.data

import kotlinx.coroutines.flow.Flow

class OlympiadRepository(private val db: AppDatabase) {
    val questions: Flow<List<QuestionEntity>> = db.questionDao().observeAll()
    val tutorQuestions: Flow<List<QuestionEntity>> = db.questionDao().observeTutorReady()
    val packs: Flow<List<ContentPackEntity>> = db.packDao().observeAll()
    val attempts: Flow<List<AttemptEntity>> = db.learningDao().observeAttempts()
    val mastery: Flow<List<MasteryEntity>> = db.learningDao().observeMastery()

    suspend fun nodes(questionId: String) = db.reasoningNodeDao().getForQuestion(questionId)

    suspend fun recordAttempt(question: QuestionEntity, score: Int) {
        val now = System.currentTimeMillis()
        db.learningDao().insertAttempt(AttemptEntity(questionId = question.id, family = question.family, score = score, finishedAt = now))
        val old = db.learningDao().getMastery(question.family)
        val nextScore = if (old == null) score.toDouble() else old.score * 0.7 + score * 0.3
        db.learningDao().upsertMastery(
            MasteryEntity(
                family = question.family,
                score = nextScore.coerceIn(0.0, 100.0),
                evidenceCount = (old?.evidenceCount ?: 0) + 1,
                updatedAt = now,
            )
        )
    }
}
