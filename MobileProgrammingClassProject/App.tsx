import { NavigationContainer } from "@react-navigation/native";
import { CaremapHealthProvider } from "./src/contexts/CaremapHealthContexts";
import { Provider } from "react-redux";
import { store } from "./src/store";
import StackNavigator from "./src/navigation/StackNavigator";
import { navigationRef } from "./src/navigation/NavigationService";

export default function App() {
  return (
    <CaremapHealthProvider>
      <Provider store={store}>
        <NavigationContainer ref={navigationRef}>
          <StackNavigator />
        </NavigationContainer>
      </Provider>
    </CaremapHealthProvider>
  );
}