package ru.ofmedia.app;

import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean isConfigured = false;

    private void setupWebView() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);

            if (!isConfigured) {
                WebSettings settings = webView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setSupportMultipleWindows(true);
                settings.setJavaScriptCanOpenWindowsAutomatically(true);

                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                        WebView.HitTestResult result = view.getHitTestResult();
                        String data = result.getExtra();
                        if (data != null && (data.startsWith("http://") || data.startsWith("https://"))) {
                            view.loadUrl(data);
                            return false;
                        }
                        return super.onCreateWindow(view, isDialog, isUserGesture, resultMsg);
                    }
                });

                webView.addJavascriptInterface(new Object() {
                    @JavascriptInterface
                    public void enterFullscreen() {
                        runOnUiThread(() -> {
                            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
                            if (controller != null) {
                                controller.hide(WindowInsetsCompat.Type.systemBars());
                                controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                            }
                        });
                    }

                    @JavascriptInterface
                    public void exitFullscreen() {
                        runOnUiThread(() -> {
                            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
                            if (controller != null) {
                                controller.show(WindowInsetsCompat.Type.systemBars());
                            }
                        });
                    }

                    @JavascriptInterface
                    public boolean isNative() {
                        return true;
                    }
                }, "AndroidScreen");

                isConfigured = true;
            }
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupWebView();
    }

    @Override
    public void onStart() {
        super.onStart();
        setupWebView();
    }

    @Override
    public void onResume() {
        super.onResume();
        setupWebView();
    }
}
