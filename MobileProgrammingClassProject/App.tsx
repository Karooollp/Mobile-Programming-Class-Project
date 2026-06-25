import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";
import { store } from "./src/store";

import { CaremapHealthProvider } from "./src/contexts/CaremapHealthContexts";
import StackNavigator from "./src/navigation/StackNavigator";
import { navigationRef } from "./src/navigation/NavigationService";

export default function App() {
  return (
    <Provider store={store}>
      <CaremapHealthProvider>
        <NavigationContainer ref={navigationRef}>
          <StackNavigator />
        </NavigationContainer>
      </CaremapHealthProvider>
    </Provider>
  );
}