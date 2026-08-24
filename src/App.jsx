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
import { OrdersPage } from './components/Orders/OrdersPage';
import { BranchesPage } from './components/Branches/BranchesPage';
import { Footer } from './components/Footer/Footer';
import { Overlay } from './components/Overlay';
import { CartDrawer } from './components/Cart/CartDrawer';
import { AccountDrawer } from './components/Account/AccountDrawer';

function Pages() {
  const { page } = useNavigation();
  return (
    <>
      <HomePage active={page === 'home'} />
      <AboutPage active={page === 'about'} />
      <OffersPage active={page === 'offers'} />
      <ShopPage active={page === 'shop'} />
      <TrackPage active={page === 'track'} />
      <OrdersPage active={page === 'orders'} />
      <BranchesPage active={page === 'branches'} />
    </>
  );
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
              </DrawerProvider>
            </OrderHistoryProvider>
          </CustomerProvider>
        </CartProvider>
      </NavigationProvider>
    </LanguageProvider>
  );
}
