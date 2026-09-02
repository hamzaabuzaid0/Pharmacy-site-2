import { LanguageProvider } from './i18n/LanguageContext';
import { CartProvider } from './context/CartContext';
import { CustomerProvider } from './context/CustomerContext';
import { DrawerProvider } from './context/DrawerContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { OrderHistoryProvider } from './context/OrderHistoryContext';

import { Header } from './components/Header/Header';
import { NavBar } from './components/Nav/NavBar';
import { HomePage } from './components/Home/HomePage';
import { AboutPage } from './components/About/AboutPage';
import { OffersPage } from './components/Offers/OffersPage';
import { ShopPage } from './components/Shop/ShopPage';
import { TrackPage } from './components/Track/TrackPage';
import { ScanPage } from './components/Scan/ScanPage';
import { OrdersPage } from './components/Orders/OrdersPage';
import { BranchesPage } from './components/Branches/BranchesPage';
import { Footer } from './components/Footer/Footer';
import { Overlay } from './components/Overlay';
import { CartDrawer } from './components/Cart/CartDrawer';
import { AccountDrawer } from './components/Account/AccountDrawer';
import { AlternativeModal } from './components/Shop/AlternativeModal';

// Only the active page is mounted — previously all 8 pages (including
// Shop's full product grid) were always rendered into the DOM and merely
// hidden with CSS, which meant every first load paid the render cost for
// pages the visitor might never open. Each page still takes an `active`
// prop for its own page/active CSS class, which is now always true since
// only the active one is ever rendered — harmless to leave as-is on each
// page component, keeps this a one-file change. The trade-off: a page's
// own local state (e.g. TrackPage's entered code, ScanPage's step) resets
// when you navigate away and back, matching normal web navigation — nothing
// here depended on it persisting (branch/category/search selections all
// live in context, not page-local state, so those still persist).
const PAGES = {
  home: HomePage,
  about: AboutPage,
  offers: OffersPage,
  shop: ShopPage,
  track: TrackPage,
  scan: ScanPage,
  orders: OrdersPage,
  branches: BranchesPage,
};

function Pages() {
  const { page } = useNavigation();
  const ActivePage = PAGES[page] || HomePage;
  return <ActivePage active />;
}

export default function App() {
  return (
    <LanguageProvider>
      <NavigationProvider>
        <CartProvider>
          <CustomerProvider>
            <OrderHistoryProvider>
              <DrawerProvider>
                <Header />
                <NavBar />
                <Pages />
                <Footer />
                <Overlay />
                <CartDrawer />
                <AccountDrawer />
                <AlternativeModal />
              </DrawerProvider>
            </OrderHistoryProvider>
          </CustomerProvider>
        </CartProvider>
      </NavigationProvider>
    </LanguageProvider>
  );
}
