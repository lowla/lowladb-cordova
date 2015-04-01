package io.lowla.lowladb;

import java.util.Arrays;
import java.util.Date;
import java.util.Map;

/**
 * Created by mark on 3/22/15.
 */
public class LDBObject {
    private long ptr;

    private LDBObject(long ptr) {
        this.ptr = ptr;
    }

    static LDBObject initWithPtr(long ptr) {
        return new LDBObject(ptr);
    }

    long ptr() {
        return ptr;
    }

    @SuppressWarnings("unchecked")
    public static LDBObject objectWithMap(Map<String, ?> map) {
        // We sort the keys to ensure consistent behavior
        String[] sortedKeys = new String[map.size()];
        map.keySet().toArray(sortedKeys);
        Arrays.sort(sortedKeys);

        LDBObjectBuilder builder = new LDBObjectBuilder();

        for (String key : sortedKeys) {
            Object value = map.get(key);
            if (value instanceof String) {
                builder.appendString(key, (String) value);
            } else if (value instanceof Date) {
                builder.appendDate(key, (Date) value);
            } else if (value instanceof Map) {
                Object bsonType = ((Map)value).get("_bsonType");
                if (null != bsonType) {
                    if (bsonType.toString().equals("ObjectId")) {
                        String hexString = ((Map) value).get("hexString").toString();
                        LDBObjectId oid = new LDBObjectId(hexString);
                        builder.appendObjectId(key, oid);
                    }
                } else {
                    builder.appendObject(key, LDBObject.objectWithMap((Map<String, ?>)value));
                }
            } else if (value instanceof Integer) {
                builder.appendInt(key, (Integer) value);
            } else if (value instanceof Long) {
                builder.appendLong(key, (Long) value);
            } else if (value instanceof Double) {
                builder.appendDouble(key, (Double) value);
            } else {
                throw new IllegalArgumentException("Unsupported object type '" + value.getClass().toString() + "' for key '" + key + "'");
            }
        }
        return builder.finish();
    }

    public native boolean containsField(String field);
    public native double doubleForField(String field);
    public native String stringForField(String field);
    public native LDBObject objectForField(String field);
    public native LDBObjectId objectIdForField(String field);
    public native boolean boolForField(String field);
    public native Date dateForField(String field);
    public native int intForField(String field);
    public native long longForField(String field);
    public native String asJson();

    @Override
    public native boolean equals(Object o);

    @Override
    public native int hashCode();

    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        close();
    }

    private void close() {
        if (0 != ptr) {
            dealloc(ptr);
            ptr = 0;
        }
    }

    private static native void dealloc(long ptr);

}
