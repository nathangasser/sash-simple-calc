import logo from './logo.png';
import CounterweightCalculator from './components/CounterweightCalculator';
import InchCalculator from './components/InchCalculator';
import CutSheetCalculator from './components/CutSheetCalculator';
import SpringboxCalculator from './components/SpringboxCalculator';
import { useLocalStorage } from './hooks/useLocalStorage';

export default function App() {
  const [tab, setTab] = useLocalStorage('heartwood.activeTab', 'counterweight');

  return (
    <div className="page">
      <div className="app-header">
        <img src={logo} alt="Heartwood Restoration" className="logo" />
        <div className="tabs">
          <button
            type="button"
            className={tab === 'counterweight' ? 'tab tab-active' : 'tab'}
            onClick={() => setTab('counterweight')}
          >
            Counterweight
          </button>
          <button
            type="button"
            className={tab === 'inches' ? 'tab tab-active' : 'tab'}
            onClick={() => setTab('inches')}
          >
            Inches
          </button>
          <button
            type="button"
            className={tab === 'cutsheet' ? 'tab tab-active' : 'tab'}
            onClick={() => setTab('cutsheet')}
          >
            Cut sheet
          </button>
          <button
            type="button"
            className={tab === 'springbox' ? 'tab tab-active' : 'tab'}
            onClick={() => setTab('springbox')}
          >
            Springbox
          </button>
        </div>
      </div>

      {tab === 'counterweight' && <CounterweightCalculator />}
      {tab === 'inches' && <InchCalculator />}
      {tab === 'cutsheet' && <CutSheetCalculator />}
      {tab === 'springbox' && <SpringboxCalculator />}
    </div>
  );
}
