import { Screen } from '@/components/screen';
import { SoonCard } from '@/components/soon-card';
import { useT } from '@/i18n';

/** react-native-maps has no web implementation; the browser preview shows a note instead. */
export function MunichMap() {
  const { t } = useT();
  return (
    <Screen title={t('tab.map')}>
      <SoonCard title={t('map.title')} body={t('map.webNote')} sf="map.fill" md="map" badge="iOS · Android" />
    </Screen>
  );
}
