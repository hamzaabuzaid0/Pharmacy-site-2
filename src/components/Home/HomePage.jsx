import { Hero } from './Hero';
import { CategoryQuickGrid } from './CategoryQuickGrid';
import { HowItWorks } from './HowItWorks';

export function HomePage({ active }) {
  return (
    <div className={'page' + (active ? ' active' : '')} id="home">
      <Hero />
      <CategoryQuickGrid />
      <HowItWorks />
    </div>
  );
}
