package io.lowla.lowladb;

/**
 * Created by mark on 3/19/15.
 */
public class LDBCollection {
    private final LDBDatabase database;
    private final String name;
    private long ptr;

    public LDBCollection(LDBDatabase database, String name) {
        this.database = database;
        this.name = name;
    }

    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        close();
    }

    public LDBDatabase getDatabase() {
        return database;
    }

    public String getName() {
        return name;
    }

    public native LDBWriteResult insert(LDBObject object);
    public native LDBWriteResult insertArray(LDBObject[] arr);
    public native LDBWriteResult remove(LDBObject object);
    public native LDBWriteResult update(LDBObject query, LDBObject object, boolean upsert, boolean multi);

    public LDBWriteResult update(LDBObject query, LDBObject object) {
        return update(query, object, false, false);
    }

    public LDBWriteResult remove() {
        return remove(null);
    }

    public LDBCursor find() {
        return find(null);
    }

    public LDBCursor find(LDBObject query) {
        ensureOpen();
        return new LDBCursor(ptr, null == query ? 0 : query.ptr());
    }

    public LDBObject findOne() {
        return findOne(null);
    }

    public LDBObject findOne(LDBObject query) {
        return find().one();
    }

    private void close() {
        if (0 != ptr) {
            dealloc(ptr);
            ptr = 0;
        }
    }

    private native void ensureOpen();
    private static native void dealloc(long ptr);
}
