package com.zhiwu.olympiadtutor.data

import androidx.room.*

@Entity(tableName = "content_packs")
data class ContentPackEntity(
    @PrimaryKey @ColumnInfo(name = "bundle_id") val bundleId: String,
    val title: String,
    @ColumnInfo(name = "bundle_version") val bundleVersion: String,
    @ColumnInfo(name = "schema_version") val schemaVersion: String,
    @ColumnInfo(name = "ontology_version") val ontologyVersion: String,
    @ColumnInfo(name = "question_count") val questionCount: Int,
    @ColumnInfo(name = "tutor_ready_count") val tutorReadyCount: Int,
    @ColumnInfo(name = "gold_labeled_count") val goldLabeledCount: Int = 0,
    @ColumnInfo(name = "structured_count") val structuredCount: Int = 0,
    @ColumnInfo(name = "asset_count") val assetCount: Int = 0,
    @ColumnInfo(name = "imported_at") val importedAt: Long,
)

@Entity(
    tableName = "questions",
    indices = [Index("bundle_id"), Index("family"), Index("tier"), Index("review_status")],
    foreignKeys = [ForeignKey(
        entity = ContentPackEntity::class,
        parentColumns = ["bundle_id"],
        childColumns = ["bundle_id"],
        onDelete = ForeignKey.CASCADE
    )]
)
data class QuestionEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "bundle_id") val bundleId: String,
    val source: String,
    val title: String,
    val family: String,
    @ColumnInfo(name = "family_id") val familyId: String = "",
    val strategy: String,
    @ColumnInfo(name = "strategy_ids_json") val strategyIdsJson: String = "[]",
    @ColumnInfo(name = "task_goal") val taskGoal: String = "",
    val difficulty: String,
    val tier: String,
    val answer: String,
    @ColumnInfo(name = "source_solution") val sourceSolution: String = "",
    @ColumnInfo(name = "review_status") val reviewStatus: String = "",
    @ColumnInfo(name = "graph_quality") val graphQuality: String = "none",
    @ColumnInfo(name = "answer_status") val answerStatus: String = "source_only",
    @ColumnInfo(name = "visual_status") val visualStatus: String = "none",
    @ColumnInfo(name = "image_assets_json") val imageAssetsJson: String = "[]",
)

@Entity(
    tableName = "reasoning_nodes",
    primaryKeys = ["question_id", "ordinal"],
    indices = [Index("question_id")],
    foreignKeys = [ForeignKey(
        entity = QuestionEntity::class,
        parentColumns = ["id"],
        childColumns = ["question_id"],
        onDelete = ForeignKey.CASCADE
    )]
)
data class ReasoningNodeEntity(
    @ColumnInfo(name = "question_id") val questionId: String,
    val ordinal: Int,
    val type: String,
    val prompt: String,
    @ColumnInfo(name = "payload_json") val payloadJson: String,
    val hint: String,
    val feedback: String,
)

@Entity(tableName = "attempts", indices = [Index("question_id"), Index("finished_at")])
data class AttemptEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "question_id") val questionId: String,
    val family: String,
    val score: Int,
    @ColumnInfo(name = "finished_at") val finishedAt: Long,
)

@Entity(tableName = "mastery")
data class MasteryEntity(
    @PrimaryKey val family: String,
    val score: Double,
    @ColumnInfo(name = "evidence_count") val evidenceCount: Int,
    @ColumnInfo(name = "updated_at") val updatedAt: Long,
)
