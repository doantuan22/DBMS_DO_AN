import { createContext, useContext } from 'react';

export const ManagerCinemaContext = createContext(null);
export const useManagerCinema = () => useContext(ManagerCinemaContext);
