package io.lowla.lowladb;

import org.apache.http.HttpResponse;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashSet;
import java.util.Set;

/**
 * Created by mark on 3/13/15.
 */
public class LDBClient {
    static {
        System.loadLibrary("lowladbjni");
    }

    public static class CollectionChangedListener {
        public void onCollectionChanged(String ns) {}
    }

    public enum LDBSyncStatus {
        PUSH_STARTED,
        PUSH_ENDED,
        PULL_STARTED,
        PULL_ENDED,
        WARNING,
        ERROR,
        OK;
    }

    public static interface SyncNotifier {
        void notify(LDBSyncStatus status, String message);
    }

    public static native String getVersion();

    public LDBDatabase getDatabase(String name) {
        return new LDBDatabase(name);
    }

    public native void dropDatabase(String name);

    public native void loadJson(String json);

    public static native void sync(String server, SyncNotifier notifier);

    public static native void enableNotifications(boolean enable);

    public static void addCollectionChangedListener(CollectionChangedListener l) {
        listeners.add(l);
    }

    public static void fireCollectionChanged(String ns) {
        for (CollectionChangedListener l : listeners) {
            l.onCollectionChanged(ns);
        }
    }

    private static byte[] doHttp(String url, byte[] request) throws IOException {
        URL theUrl = new URL(url);
        HttpURLConnection conn = (HttpURLConnection)theUrl.openConnection();
        if (null != request) {
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            OutputStream os = conn.getOutputStream();
            os.write(request);
        }
        InputStream is = new BufferedInputStream(conn.getInputStream());
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int count = 0;
        try {
            while ((count = is.read(buffer)) != -1) {
                bos.write(buffer, 0, count);
            }
        }
        finally {
            try {is.close();} catch (Exception offs) {
            }
        }
        return bos.toByteArray();
    }

    private static Set<CollectionChangedListener> listeners = new HashSet<CollectionChangedListener>();
}
