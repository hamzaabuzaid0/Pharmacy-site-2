import { useDrawer } from '../context/DrawerContext';

export function Overlay() {
  const { openDrawer, closeAll } = useDrawer();
  return (
    <div className={'overlay' + (openDrawer ? ' show' : '')} onClick={closeAll} />
  );
}
