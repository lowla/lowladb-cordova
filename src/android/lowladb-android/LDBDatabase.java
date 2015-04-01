package io.lowla.lowladb;

/**
 * Created by mark on 3/13/15.
 */
public class LDBDatabase {
    private String name;
    long ptr;

    public LDBDatabase(String name) {
        this.name = name;
        this.ptr = alloc(name);
    }

    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        close();
    }

    public LDBCollection getCollection(String name) {
        return new LDBCollection(this, name);
    }

    public native String[] collectionNames();

    public String getName() {
        return name;
    }

    private void close() {
        if (0 != ptr) {
            dealloc(ptr);
            ptr = 0;
        }
    }

    private static native long alloc(String name);
    private static native void dealloc(long ptr);
}
