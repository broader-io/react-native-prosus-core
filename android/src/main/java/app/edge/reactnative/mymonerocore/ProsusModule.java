package app.edge.reactnative.prosuscore;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class ProsusModule extends ReactContextBaseJavaModule {
  private native String callProsusJNI(String method, String arguments);

  static {
    System.loadLibrary("prosus-jni");
  }

  public ProsusModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ProsusCore";
  }

  @ReactMethod
  public void callProsus(String method, String arguments, Promise promise) {
    try {
      promise.resolve(callProsusJNI(method, arguments));
    } catch (Exception e) {
      promise.reject("ProsusError", e);
    }
  }
}
