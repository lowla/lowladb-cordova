package io.lowla.lowladb;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import io.lowla.lowladb.platform.android.Integration;

public class LDBCordova extends CordovaPlugin {
    private Map<String, Class<? extends CordovaOperation>> ops;
    private Map<String, List<CallbackContext>> liveCursors;

    static class MapAdapter implements Map<String, Object> {
        private JSONObject obj;

        MapAdapter(JSONObject obj) {
            this.obj = obj;
        }

        @Override
        public void clear() {
            throw new UnsupportedOperationException();
        }

        @Override
        public boolean containsKey(Object key) {
            return obj.has(key.toString());
        }

        @Override
        public boolean containsValue(Object value) {
            throw new UnsupportedOperationException();
        }

        @Override
        public Set<Entry<String, Object>> entrySet() {
            throw new UnsupportedOperationException();
        }

        @Override
        public Object get(Object key) {
            Object answer = obj.opt(key.toString());
            if (answer instanceof JSONObject) {
                answer = new MapAdapter((JSONObject)answer);
            }
            return answer;
        }

        @Override
        public boolean isEmpty() {
            return obj.length() == 0;
        }

        @Override
        public Set<String> keySet() {
            Set<String> answer = new HashSet<String>();
            Iterator<String> it = obj.keys();
            while (it.hasNext()) {
                answer.add(it.next());
            }
            return answer;
        }

        @Override
        public void putAll(Map map) {
            throw new UnsupportedOperationException();
        }

        @Override
        public Object remove(Object key) {
            throw new UnsupportedOperationException();
        }

        @Override
        public int size() {
            return obj.length();
        }

        @Override
        public Collection<Object> values() {
            throw new UnsupportedOperationException();
        }

        @Override
        public Object put(String key, Object value) {
            throw new UnsupportedOperationException();
        }
    }

    abstract class CordovaOperation implements Runnable {
        @Override
        public final void run() {
            try {
                runOperation();
            }
            catch (JSONException e) {
                callbackContext.error(e.getMessage());
            }
        }

        void setArgs(JSONArray args) {
            this.args = args;
        }

        void setCallbackContext(CallbackContext callbackContext) {
            this.callbackContext = callbackContext;
        }

        protected abstract void runOperation() throws JSONException;

        protected JSONArray args;
        protected CallbackContext callbackContext;
    }

    @Override
    protected void pluginInitialize() {
        Integration.INSTANCE.init(this.cordova.getActivity().getApplicationContext(), "LowlaDB");

        ops = new HashMap<String, Class<? extends CordovaOperation>>();
        ops.put("db_collectionNames", Db_CollectionNames.class);
        ops.put("db_dropDatabase", Db_DropDatabase.class);
        ops.put("db_sync", Db_Sync.class);
        ops.put("collection_findAndModify", Collection_FindAndModify.class);
        ops.put("collection_insert", Collection_Insert.class);
        ops.put("collection_remove", Collection_Remove.class);
        ops.put("cursor_count", Cursor_Count.class);
        ops.put("cursor_each", Cursor_Each.class);
        ops.put("cursor_on", Cursor_On.class);
        ops.put("lowla_load", Lowla_Load.class);

        liveCursors = new HashMap<String, List<CallbackContext>>();

        LDBClient.enableNotifications(true);
        LDBClient.addCollectionChangedListener(new LDBClient.CollectionChangedListener() {
            public void onCollectionChanged(String ns) {
                notifyLive(ns);
            }
        });
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        Class<? extends CordovaOperation> clazz = ops.get(action);
        if (null == clazz) {
            return false;
        }
        CordovaOperation op;
        try {
            Constructor<? extends CordovaOperation> ctor = clazz.getDeclaredConstructor(LDBCordova.class);
            op = ctor.newInstance(this);
        } catch (InstantiationException e) {
            return false;
        } catch (IllegalAccessException e) {
            return false;
        } catch (NoSuchMethodException e) {
            return false;
        } catch (InvocationTargetException e) {
            return false;
        }
        op.setArgs(args);
        op.setCallbackContext(callbackContext);
        cordova.getThreadPool().execute(op);
        return true;
    }

    class Db_CollectionNames extends CordovaOperation {
        @Override
        protected void runOperation() throws JSONException {
            String dbName = args.getString(0);
            LDBClient client = new LDBClient();
            LDBDatabase db = client.getDatabase(dbName);
            String[] names = db.collectionNames();
            callbackContext.success(new JSONArray(Arrays.asList(names)));
        }
    }

    class Db_DropDatabase extends CordovaOperation {
        @Override
        protected void runOperation() throws JSONException {
            String dbName = args.getString(0);
            LDBClient client = new LDBClient();
            client.dropDatabase(dbName);
            callbackContext.success();
        }
    }

    class Db_Sync extends CordovaOperation {
        @Override
        protected void runOperation() throws JSONException {
            String server = args.getString(0);
            if (null == server) {
                callbackContext.error("No server specified");
                return;
            }
            LDBClient.sync(server, new LDBClient.SyncNotifier() {
                @Override
                public void notify(LDBClient.LDBSyncStatus status, String message) {
                    PluginResult pluginResult = null;
                    switch (status) {
                        case PUSH_STARTED:
                            pluginResult = new PluginResult(PluginResult.Status.OK, "pushBegin");
                            pluginResult.setKeepCallback(true);
                            break;
                        case PUSH_ENDED:
                            pluginResult = new PluginResult(PluginResult.Status.OK, "pushEnd");
                            pluginResult.setKeepCallback(true);
                            break;
                        case PULL_STARTED:
                            pluginResult = new PluginResult(PluginResult.Status.OK, "pullBegin");
                            pluginResult.setKeepCallback(true);
                            break;
                        case PULL_ENDED:
                            pluginResult = new PluginResult(PluginResult.Status.OK, "pullEnd");
                            pluginResult.setKeepCallback(true);
                            break;
                        case WARNING:
                            // Nothing for now
                            break;
                        case ERROR:
                            pluginResult = new PluginResult(PluginResult.Status.ERROR, message);
                            break;
                        case OK:
                            pluginResult = new PluginResult(PluginResult.Status.OK, (String)null);
                            break;
                    }
                    if (null != pluginResult) {
                        callbackContext.sendPluginResult(pluginResult);
                    }
                }
            });
        }
    }

    class Collection_FindAndModify extends CordovaOperation {
        @Override
        protected void runOperation() throws JSONException {
            String dbName = args.getString(0);
            String collName = args.getString(1);
            JSONObject querySpec = args.optJSONObject(2);
            JSONObject opSpec = args.getJSONObject(3);
            try {
                LDBClient client = new LDBClient();
                LDBDatabase db = client.getDatabase(dbName);
                LDBCollection coll = db.getCollection(collName);
                LDBObject query = null;
                if (null != querySpec) {
                    query = LDBObject.objectWithMap(new MapAdapter(querySpec));
                }
                LDBObject ops = LDBObject.objectWithMap(new MapAdapter(opSpec));
                LDBWriteResult wr = coll.update(query, ops);
                if (0 < wr.getDocumentCount()) {
                    callbackContext.success(wr.getDocument(0).asJson());
                } else {
                    callbackContext.success();
                }
            }
            catch (Exception e) {
                callbackContext.error(e.getMessage());
            }
        }
    }

    class Collection_Insert extends CordovaOperation {
        @Override
        protected void runOperation() throws JSONException {
            String dbName = args.getString(0);
            String collName = args.getString(1);

            LDBClient client = new LDBClient();
            LDBDatabase db = client.getDatabase(dbName);
            LDBCollection coll = db.getCollection(collName);
            LDBWriteResult wr;
            try {
                JSONArray arrData = args.optJSONArray(2);
                JSONObject objData = args.optJSONObject(2);
                if (null != objData) {
                    LDBObject obj = LDBObject.objectWithMap(new MapAdapter(objData));
                    wr = coll.insert(obj);
                }
                else {
                    LDBObject[] arr = new LDBObject[arrData.length()];
                    for (int i = 0 ; i < arrData.length() ; ++i) {
                        arr[i] = LDBObject.objectWithMap(new MapAdapter(arrData.getJSONObject(i)));
                    }
                    wr = coll.insertArray(arr);
                }
                JSONArray answer = new JSONArray();
                for (int i = 0 ; i < wr.getDocumentCount() ; ++i) {
                    answer.put(wr.getDocument(i).asJson());
                }
                callbackContext.success(answer);
            }
            catch (Exception e) {
                callbackContext.error(e.getMessage());
            }
        }
    }

    class Collection_Remove extends CordovaOperation {
        @Override
        protected void runOperation() throws JSONException {
            String dbName = args.getString(0);
            String collName = args.getString(1);
            JSONObject querySpec = args.optJSONObject(2);

            LDBClient client = new LDBClient();
            LDBDatabase db = client.getDatabase(dbName);
            LDBCollection coll = db.getCollection(collName);
            LDBObject query = null;
            if (null != querySpec) {
                query = LDBObject.objectWithMap(new MapAdapter(querySpec));
            }
            LDBWriteResult wr = coll.remove(query);
            callbackContext.success(wr.getDocumentCount());
        }
    }

    private LDBObject convertSortSpec(Object sortSpec) throws JSONException {
        if (sortSpec instanceof String) {
            return new LDBObjectBuilder().appendInt((String)sortSpec, 1).finish();
        }
        else if (sortSpec instanceof JSONArray) {
            boolean foundOne = false;
            LDBObjectBuilder builder = new LDBObjectBuilder();
            for (int i = 0 ; i < ((JSONArray)sortSpec).length() ; ++i) {
                Object obj = ((JSONArray)sortSpec).get(i);
                if (obj instanceof String) {
                    builder.appendInt((String)obj, 1);
                    foundOne = true;
                }
                else if (obj instanceof JSONArray) {
                    JSONArray arr = (JSONArray)obj;
                    if (1 <= arr.length()) {
                        String name = arr.optString(0);
                        if (null != name) {
                            int asc = 1;
                            if (2 <= arr.length()) {
                                asc = 0 < arr.optInt(1, 1) ? 1 : -1;
                            }
                            builder.appendInt(name, asc);
                            foundOne = true;
                        }
                    }
                }
            }
            if (foundOne) {
                return builder.finish();
            }
        }
        return null;
    }

    private LDBCursor convertCursorSpec(JSONObject cursorSpec) throws JSONException {
        if (null == cursorSpec) {
            return null;
        }
        JSONObject collSpec = cursorSpec.getJSONObject("_collection");
        String dbName = collSpec.getString("dbName");
        String collName = collSpec.getString("collectionName");

        LDBClient client = new LDBClient();
        LDBDatabase db = client.getDatabase(dbName);
        LDBCollection coll = db.getCollection(collName);

        JSONObject filterSpec = cursorSpec.optJSONObject("_filter");
        LDBObject filter = null;
        if (null != filterSpec) {
            filter = LDBObject.objectWithMap(new MapAdapter(filterSpec));
        }
        LDBCursor cursor = coll.find(filter);

        JSONObject options = cursorSpec.optJSONObject("_options");
        if (null != options) {
            Object sortSpec = options.get("sort");
            if (null != sortSpec) {
                LDBObject sort = convertSortSpec(sortSpec);
                if (null != sort) {
                    cursor = cursor.sort(sort);
                }
            }
            int limit = options.optInt("limit");
            if (0 < limit) {
                cursor = cursor.limit(limit);
            }
            boolean showPending = options.optBoolean("showPending");
            if (showPending) {
                cursor = cursor.showPending();
            }
        }
        return cursor;
    }

    class Cursor_Count extends CordovaOperation {
        @Override
        public void runOperation() throws JSONException {
            JSONObject cursorSpec = args.getJSONObject(0);

            LDBCursor cursor = null;
            try {
                cursor = convertCursorSpec(cursorSpec);
                if (null != cursor) {
                    callbackContext.success((int) cursor.count());
                } else {
                    callbackContext.error("Cursor has invalid structure");
                }
            }
            finally {
                if (null != cursor) {
                    cursor.close();
                }
            }
        }
    }

    class Cursor_Each extends CordovaOperation {
        @Override
        protected void runOperation() throws JSONException {
            JSONObject cursorSpec = args.getJSONObject(0);

            LDBCursor cursor = null;
            try {
                cursor = convertCursorSpec(cursorSpec);
                if (null != cursor) {
                    while (cursor.hasNext()) {
                        PluginResult pluginResult = new PluginResult(PluginResult.Status.OK, cursor.next().asJson());
                        pluginResult.setKeepCallback(true);
                        callbackContext.sendPluginResult(pluginResult);
                    }
                    PluginResult pluginResult = new PluginResult(PluginResult.Status.OK, false);
                    pluginResult.setKeepCallback(false);
                    callbackContext.sendPluginResult(pluginResult);
                } else {
                    callbackContext.error("Cursor has invalid structure");
                }
            }
            finally {
                if (null != cursor) {
                    cursor.close();
                }
            }
        }
    }

    private void addLiveCursor(String ns, CallbackContext callbackContext) {
        List<CallbackContext> callbacks = liveCursors.get(ns);
        if (null == callbacks) {
            callbacks = new ArrayList<CallbackContext>();
            liveCursors.put(ns, callbacks);
        }
        callbacks.add(callbackContext);
    }

    private void notifyLive(String ns) {
        List<CallbackContext> callbacks = liveCursors.get(ns);
        if (null != callbacks) {
            for (CallbackContext callbackContext : callbacks) {
                PluginResult pluginResult = new PluginResult(PluginResult.Status.OK, "notify");
                pluginResult.setKeepCallback(true);
                callbackContext.sendPluginResult(pluginResult);
            }
        }
    }

    class Cursor_On extends CordovaOperation {
        @Override
        protected void runOperation() throws JSONException {
            JSONObject cursorSpec = args.getJSONObject(0);
            JSONObject collSpec = cursorSpec.getJSONObject("_collection");
            String dbName = collSpec.getString("dbName");
            String collName = collSpec.getString("collectionName");

            addLiveCursor(dbName + "." + collName, callbackContext);
            PluginResult pluginResult = new PluginResult(PluginResult.Status.OK, "started");
            pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);
        }
    }

    class Lowla_Load extends CordovaOperation {
        @Override
        protected void runOperation() throws JSONException {
            String json = args.getString(0);
            LDBClient client = new LDBClient();
            client.loadJson(json);
            callbackContext.success();
        }
    }
}
