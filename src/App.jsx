import logo from './logo.png';
import CounterweightCalculator from './components/CounterweightCalculator';
import InchCalculator from './components/InchCalculator';
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
        </div>
      </div>

      {tab === 'counterweight' ? <CounterweightCalculator /> : <InchCalculator />}
    </div>
  );
}
