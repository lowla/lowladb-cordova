package io.lowla.lowladb.platform.android;

import android.content.Context;

/**
 * Created by mark on 3/24/15.
 */
public enum Integration {
    INSTANCE;

    private Context context;

    public void setContext(Context context) {
        this.context = context;
    }

    public String getDataDirectory() {
        String answer = context.getDir("LowlaDB", Context.MODE_PRIVATE).getAbsolutePath();
        return answer;
    }
}
