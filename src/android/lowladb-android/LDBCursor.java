package io.lowla.lowladb;

/**
 * Created by mark on 3/25/15.
 */
public class LDBCursor {
    private long ptr;
    private boolean readStarted;
    private LDBObject nextRecord;

    LDBCursor(long collectionPtr, long objectPtr) {
        ptr = alloc(collectionPtr, objectPtr);
    }

    private LDBCursor(long ptr) {
        this.ptr = ptr;
    }

    public native long count();
    public native LDBCursor limit(int limit);
    public native LDBCursor sort(LDBObject sort);
    public native LDBCursor showPending();

    public LDBObject next() {
        if (hasNext()) {
            LDBObject answer = nextRecord;
            nextRecord = nextRecord();
            return answer;
        }
        return null;
    }

    public boolean hasNext() {
        if (!readStarted) {
            nextRecord = nextRecord();
            readStarted = true;
        }
        return null != nextRecord;
    }

    public LDBObject one() {
        return limit(1).next();
    }

    public void close() {
        if (0 != ptr) {
            dealloc(ptr);
            ptr = 0;
        }
    }

    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        close();
    }

    private native LDBObject nextRecord();

    private static native long alloc(long collectionPtr, long objectPtr);
    private static native void dealloc(long ptr);
}
