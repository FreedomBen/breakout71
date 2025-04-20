package me.lecaro.breakout

import android.app.Activity
import android.app.DownloadManager
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import android.view.Window
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.DownloadListener
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.widget.Toast
import java.io.File
import java.net.URLDecoder
import java.nio.charset.Charset
import java.nio.charset.StandardCharsets
import java.text.SimpleDateFormat
import java.util.Date
import java.util.jar.Manifest

const val CHOOSE_FILE_REQUEST_CODE = 548459

class MainActivity : android.app.Activity() {

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {

        super.onActivityResult(requestCode, resultCode, data)
        when (requestCode) {
            CHOOSE_FILE_REQUEST_CODE -> {
                if (resultCode == RESULT_OK) {
                    filePathCallback?.onReceiveValue(
                        WebChromeClient.FileChooserParams.parseResult(
                            resultCode, data
                        )
                    )
                    filePathCallback = null
                }
            }
        }
    }

    var filePathCallback: ValueCallback<Array<Uri>>? = null

    private fun downloadFile(url: String) {
        try {
            if (!url.startsWith("data:application/json;charset=utf-8,")) {
                Log.w("DL", "url ignored because it does not start with data:")
                return
            }
            val sdf = SimpleDateFormat("yyyy-M-dd-hh-mm")
            val currentDate = sdf.format(Date())
            val urlEncoded = url.substring("data:application/json;charset=utf-8,".length)
            val  str =URLDecoder.decode(urlEncoded, StandardCharsets.UTF_8.name())

            writeFile(str,  "breakout-71-save-$currentDate.json", "application/json")

        } catch (e: Exception) {
            Log.e("DL", "Error ${e.message}")
            Toast.makeText(this, "Error ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    fun writeFile(jsonData:String,fileName:String, mime:String){

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    // android 10
                    val contentValues = ContentValues().apply {
                        put(MediaStore.Downloads.DISPLAY_NAME, fileName)
                        put(MediaStore.Downloads.MIME_TYPE,mime )
                        put(MediaStore.Downloads.RELATIVE_PATH,  Environment.DIRECTORY_DOWNLOADS)
                    }

                    val uri: Uri? = contentResolver.insert(
                        MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues
                    )
                    uri?.let {
                        contentResolver.openOutputStream(it)?.use { outputStream ->
                            outputStream.write(jsonData.toByteArray())
                        }
                    }

                    val shareIntent: Intent = Intent().apply {
                        action = Intent.ACTION_SEND
                        putExtra(Intent.EXTRA_STREAM, uri)
                        type = mime
                    }
                    startActivity(Intent.createChooser(shareIntent, null))

                } else {


                    val dir = getExternalFilesDir(null)
                    val file = File(dir, fileName)
                    file.writeText(jsonData)
                    Toast.makeText(this, "Saved in $dir", Toast.LENGTH_LONG).show()

                }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        val webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.setSupportZoom(false)


        webView.loadUrl("file:///android_asset/index.html?isInWebView=true")
        val activity = this;

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                Log.d(
                    "WebView",
                    "${consoleMessage.message()} -- From line " + "${consoleMessage.lineNumber()} of ${consoleMessage.sourceId()}"
                )
                return true
            }


            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                try {

                    startActivityForResult(
                        fileChooserParams?.createIntent(), CHOOSE_FILE_REQUEST_CODE
                    )
                    this@MainActivity.filePathCallback = filePathCallback
                    return true
                } catch (e: Exception) {
                    Log.e("DL", "Error ${e.message}")
                    Toast.makeText(activity, "Error ${e.message}", Toast.LENGTH_LONG).show()
                    return false
                }
            }
        }

        webView.setDownloadListener(DownloadListener { url, userAgent, contentDisposition, mimetype, contentLength ->
            Log.d("DL", "url: ${url}")
            Log.d("DL", "userAgent: ${userAgent}")
            Log.d("DL", "contentDisposition: ${contentDisposition}")
            Log.d("DL", "mimetype: ${mimetype}")
            Log.d("DL", "contentLength: ${contentLength}")

            downloadFile(url)
        })



        setContentView(webView)
    }
}