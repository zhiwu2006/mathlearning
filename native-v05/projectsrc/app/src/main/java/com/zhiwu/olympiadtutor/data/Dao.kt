package com.zhiwu.olympiadtutor.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface QuestionDao {
    @Query("SELECT * FROM questions ORDER BY source, id")
    fun observeAll(): Flow<List<QuestionEntity>>

    @Query("SELECT * FROM questions WHERE tier = 'tutor' ORDER BY source, id")
    fun observeTutorReady(): Flow<List<QuestionEntity>>

    @Query("SELECT COUNT(*) FROM questions") fun observeCount(): Flow<Int>
    @Query("SELECT COUNT(*) FROM questions WHERE tier = 'tutor'") fun observeTutorCount(): Flow<Int>
    @Query("SELECT COUNT(*) FROM questions") suspend fun countOnce(): Int
    @Query("SELECT * FROM questions WHERE id = :id LIMIT 1") suspend fun getById(id: String): QuestionEntity?
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun upsert(question: QuestionEntity)
    @Query("DELETE FROM questions WHERE bundle_id = :bundleId") suspend fun deleteBundle(bundleId: String)
}

@Dao
interface ReasoningNodeDao {
    @Query("SELECT * FROM reasoning_nodes WHERE question_id = :questionId ORDER BY ordinal")
    suspend fun getForQuestion(questionId: String): List<ReasoningNodeEntity>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun upsert(node: ReasoningNodeEntity)
    @Query("DELETE FROM reasoning_nodes WHERE question_id IN (SELECT id FROM questions WHERE bundle_id = :bundleId)")
    suspend fun deleteForBundle(bundleId: String)
}

@Dao
interface PackDao {
    @Query("SELECT * FROM content_packs ORDER BY imported_at DESC") fun observeAll(): Flow<List<ContentPackEntity>>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun upsert(pack: ContentPackEntity)
    @Query("DELETE FROM content_packs WHERE bundle_id = :bundleId") suspend fun delete(bundleId: String)
}

@Dao
interface LearningDao {
    @Insert suspend fun insertAttempt(attempt: AttemptEntity)
    @Query("SELECT * FROM attempts ORDER BY finished_at DESC LIMIT 50") fun observeAttempts(): Flow<List<AttemptEntity>>
    @Query("SELECT * FROM mastery ORDER BY score ASC, evidence_count DESC") fun observeMastery(): Flow<List<MasteryEntity>>
    @Query("SELECT * FROM mastery WHERE family = :family LIMIT 1") suspend fun getMastery(family: String): MasteryEntity?
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun upsertMastery(mastery: MasteryEntity)
}
