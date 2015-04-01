package io.lowla.lowladb;

import java.util.Arrays;

/**
 * Created by mark on 3/22/15.
 */
public class LDBObjectId {
    byte[] data;

    public static native LDBObjectId generate();

    private LDBObjectId(byte[] bytes) {
        this.data = bytes;
    }

    LDBObjectId(String hex) {
        this(oidFromString(hex));
    }

    @Override
    public String toString() {
        return "ObjectId\"" + toHexString() + "\")";
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof LDBObjectId)) {
            return false;
        }
        return Arrays.equals(data, ((LDBObjectId)o).data);
    }

    @Override
    public int hashCode() {
        return Arrays.hashCode(data);
    }

    public native String toHexString();

    private static native byte[] oidFromString(String hex);
}
