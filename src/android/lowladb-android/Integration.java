package io.lowla.lowladb.platform.android;

import android.content.Context;
import android.content.SharedPreferences;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by mark on 3/24/15.
 */
public enum Integration {
    INSTANCE;

    private Context context;
    private SharedPreferences prefs;

    public void init(Context context, String prefsName) {
        this.context = context;
        this.prefs = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE);
    }

    public String getProperty(String key, String defaultValue) {
        try {
            return prefs.getString(key, defaultValue);
        }
        catch (ClassCastException e) {
            return defaultValue;
        }
    }

    public void setProperty(String key, String value) {
        SharedPreferences.Editor editor = prefs.edit();
        if (null == value) {
            editor.remove(key);
        }
        else {
            editor.putString(key, value);
        }

        editor.commit();
    }

    public String getDataDirectory() {
        String answer = context.getDir("LowlaDB", Context.MODE_PRIVATE).getAbsolutePath();
        return answer;
    }

    public String[] listFiles() {
        List<String> answer = new ArrayList<String>();
        String dir = context.getDir("LowlaDB", Context.MODE_PRIVATE).getAbsolutePath();
        File root = new File(getDataDirectory());
        listFilesInto(root.getAbsolutePath().length(), root, answer);
        return answer.toArray(new String[answer.size()]);
    }

    private void listFilesInto(int rootLength, File path, List<String> answer) {
        File[] files = path.listFiles();
        for (int x = 0; x < files.length; ++x) {
            if (files[x].isDirectory()) {
                listFilesInto(rootLength, files[x], answer);
            }
            else {
                answer.add(files[x].getAbsolutePath().substring(rootLength + 1));
            }
        }
    }
}
