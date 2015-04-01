package io.lowla.lowladb;

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

    public static native String getVersion();

    public LDBDatabase getDatabase(String name) {
        return new LDBDatabase(name);
    }

    public native void dropDatabase(String name);

    public native void loadJson(String json);

    public static native void enableNotifications(boolean enable);

    public static void addCollectionChangedListener(CollectionChangedListener l) {
        listeners.add(l);
    }

    public static void fireCollectionChanged(String ns) {
        for (CollectionChangedListener l : listeners) {
            l.onCollectionChanged(ns);
        }
    }

    private static Set<CollectionChangedListener> listeners = new HashSet<CollectionChangedListener>();
}
