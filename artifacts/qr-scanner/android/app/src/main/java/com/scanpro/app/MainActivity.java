package com.scanpro.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Expose a native bridge for JS to open Android app settings directly.
        // Called from ScannerPage when camera permission is permanently blocked.
        getBridge().getWebView().addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
    }

    private class AndroidBridge {
        @JavascriptInterface
        public void openSettings() {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:com.scanpro.app"));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        }
    }
}
