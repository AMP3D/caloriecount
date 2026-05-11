import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { DayDetail } from './components/DayDetail/DayDetail';
import { DayList } from './components/DayList/DayList';

export const App = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <Routes>
      <Route element={<DayList />} path="/" />

      <Route element={<DayDetail />} path="/day/:dateId" />
    </Routes>
  </BrowserRouter>
);
