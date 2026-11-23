import { I18nManager, Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import * as Updates from 'expo-updates';
import App from './App';

// التطبيق عربي: نفعّل الاتجاه من اليمين لليسار (يحتاج إعادة تحميل مرة وحدة أول تشغيل)
if (Platform.OS === 'web') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
} else if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  Updates.reloadAsync().catch(() => {});
}

registerRootComponent(App);
