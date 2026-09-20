package ru.ofmedia.app;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private void disableOverScroll() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            View webView = getBridge().getWebView();
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        disableOverScroll();
    }

    @Override
    public void onStart() {
        super.onStart();
        disableOverScroll();
    }

    @Override
    public void onResume() {
        super.onResume();
        disableOverScroll();
    }
}
