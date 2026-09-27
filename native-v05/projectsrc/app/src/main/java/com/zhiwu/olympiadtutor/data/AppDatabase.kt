package com.zhiwu.olympiadtutor.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [ContentPackEntity::class, QuestionEntity::class, ReasoningNodeEntity::class, AttemptEntity::class, MasteryEntity::class],
    version = 3,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun questionDao(): QuestionDao
    abstract fun reasoningNodeDao(): ReasoningNodeDao
    abstract fun packDao(): PackDao
    abstract fun learningDao(): LearningDao

    companion object {
        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE questions ADD COLUMN image_assets_json TEXT NOT NULL DEFAULT '[]'")
            }
        }
        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE content_packs ADD COLUMN gold_labeled_count INTEGER NOT NULL DEFAULT 0")
                db.execSQL("ALTER TABLE content_packs ADD COLUMN structured_count INTEGER NOT NULL DEFAULT 0")
                db.execSQL("ALTER TABLE content_packs ADD COLUMN asset_count INTEGER NOT NULL DEFAULT 0")
                db.execSQL("ALTER TABLE questions ADD COLUMN family_id TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE questions ADD COLUMN strategy_ids_json TEXT NOT NULL DEFAULT '[]'")
                db.execSQL("ALTER TABLE questions ADD COLUMN task_goal TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE questions ADD COLUMN source_solution TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE questions ADD COLUMN review_status TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE questions ADD COLUMN graph_quality TEXT NOT NULL DEFAULT 'none'")
                db.execSQL("ALTER TABLE questions ADD COLUMN answer_status TEXT NOT NULL DEFAULT 'source_only'")
                db.execSQL("ALTER TABLE questions ADD COLUMN visual_status TEXT NOT NULL DEFAULT 'none'")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_questions_review_status ON questions(review_status)")
            }
        }

        @Volatile private var INSTANCE: AppDatabase? = null
        fun get(context: Context): AppDatabase = INSTANCE ?: synchronized(this) {
            INSTANCE ?: Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                "olympiad_tutor_runtime.db"
            ).addMigrations(MIGRATION_1_2, MIGRATION_2_3).build().also { INSTANCE = it }
        }
    }
}
