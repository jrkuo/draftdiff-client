import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import DualSelectTable from './SelectTable'

function App() {
  return (
    <Router>
      <div className="App">
        <DualSelectTable />
      </div>
    </Router>
  );
}

export default App;
