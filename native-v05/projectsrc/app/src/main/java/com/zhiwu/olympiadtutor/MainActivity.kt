package com.zhiwu.olympiadtutor

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.zhiwu.olympiadtutor.data.AppDatabase
import com.zhiwu.olympiadtutor.data.ContentPackImporter
import com.zhiwu.olympiadtutor.data.OlympiadRepository
import com.zhiwu.olympiadtutor.ui.OlympiadApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val db = AppDatabase.get(this)
        val repository = OlympiadRepository(db)
        val importer = ContentPackImporter(this, db)
        setContent { OlympiadApp(repository, importer) }
    }
}
