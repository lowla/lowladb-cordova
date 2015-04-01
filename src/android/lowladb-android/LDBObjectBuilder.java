package io.lowla.lowladb;

import java.util.Date;

/**
 * Created by mark on 3/22/15.
 */
public class LDBObjectBuilder {
    private long ptr;

    public LDBObjectBuilder() {
        this.ptr = alloc();
    }

    public native LDBObjectBuilder appendDouble(String field, double value);
    public native LDBObjectBuilder appendString(String field, String value);
    public native LDBObjectBuilder appendObject(String field, LDBObject value);
    public native LDBObjectBuilder appendObjectId(String field, LDBObjectId value);
    public native LDBObjectBuilder appendBool(String field, boolean value);
    public native LDBObjectBuilder appendDate(String field, Date value);
    public native LDBObjectBuilder appendInt(String field, int value);
    public native LDBObjectBuilder appendLong(String field, long value);

    public LDBObject finish() {
        return LDBObject.initWithPtr(finishBson());
    }

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

    private static native long alloc();
    private static native void dealloc(long ptr);
    private native long finishBson();
}
