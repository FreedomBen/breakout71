package me.lecaro.breakout
import android.app.Activity
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
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
import java.text.SimpleDateFormat
import java.util.Date

const val CHOOSE_FILE_REQUEST_CODE = 548459
class MainActivity : android.app.Activity() {

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {

        super.onActivityResult(requestCode, resultCode, data)
        when (requestCode) {
            CHOOSE_FILE_REQUEST_CODE -> {
                if (resultCode == RESULT_OK) {
                    filePathCallback?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data))
                    filePathCallback = null
                }
            }
        }
    }
    var filePathCallback: ValueCallback<Array<Uri>>? = null
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        val webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.setSupportZoom(false)
        webView.loadUrl("file:///android_asset/index.html?isInWebView=true")


        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                Log.d(
                    "WebView", "${consoleMessage.message()} -- From line " +
                            "${consoleMessage.lineNumber()} of ${consoleMessage.sourceId()}"
                )
                return true
            }
            override fun onShowFileChooser(webView: WebView?, filePathCallback: ValueCallback<Array<Uri>>?, fileChooserParams: FileChooserParams?): Boolean {
                startActivityForResult(fileChooserParams?.createIntent(), CHOOSE_FILE_REQUEST_CODE)
                this@MainActivity.filePathCallback = filePathCallback
                return true
            }
        }
        webView.setDownloadListener(DownloadListener { url, userAgent, contentDisposition, mimetype, contentLength ->

            if (!url.startsWith("data:")) {
                Log.w("DL","url ignored because it does not start with data:")
                return@DownloadListener
            }
            val sdf = SimpleDateFormat("yyyy-M-dd-hh-mm")
            val currentDate = sdf.format(Date())
            // Extract filename from contentDisposition if available

            if (url.startsWith("data:application/json;base64,")) {
                Log.d("DL","saving application/json ")
                val base64Data = url.substringAfterLast(',')
                val decodedBytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
                val jsonData = String(decodedBytes)
                ;
                val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val fileName = "breakout-71-save-$currentDate.b71"
                val file = File(dir, fileName)
                file.writeText(jsonData)
                Toast.makeText(this, "Saved in $dir", Toast. LENGTH_LONG).show()
                Log.d("DL","finished saving application/json ")

            }else if (url.startsWith("data:video/webm;base64,")){
                Log.d("DL","saving video/webm ")
                // TODO
                Log.d("DL","finished savign video/webm ")
            }else{
                Log.w("DL","unexpected type "+url)
            }

        })



        setContentView(webView)
    }
}
