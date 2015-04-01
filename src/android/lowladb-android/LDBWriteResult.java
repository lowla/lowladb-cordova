package io.lowla.lowladb;

/**
 * Created by mark on 3/24/15.
 */
public class LDBWriteResult {
    private long ptr;

    LDBWriteResult(long ptr) {
        this.ptr = ptr;
    }

    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        close();
    }

    public native int getDocumentCount();
    public native LDBObject getDocument(int n);

    private void close() {
        if (0 != ptr) {
            dealloc(ptr);
            ptr = 0;
        }
    }

    private static native void dealloc(long ptr);
}
