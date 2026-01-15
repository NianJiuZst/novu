export const renderNovuBrandingInConsole = () => {
  const logo = `
              @@@@@@@@@@@@@        
      @@@       @@@@@@@@@@@        
    @@@@@@@@       @@@@@@@@        
  @@@@@@@@@@@@       @@@@@@     @@ 
 @@@@@@@@@@@@@@@@      @@@@     @@@
@@@@@@@@@@@@@@@@@@@       @     @@@
@@@@@         @@@@@@@@         @@@@
 @@@     @       @@@@@@@@@@@@@@@@@@
 @@@     @@@@      @@@@@@@@@@@@@@@@
  @@     @@@@@@       @@@@@@@@@@@@ 
         @@@@@@@@       @@@@@@@@   
         @@@@@@@@@@@       @@@     
         @@@@@@@@@@@@@                  
        `;

  console.log(`%c${logo}`, `font-size: 8px;`);

  console.log(
    '%cWelcome to Novu Dashboard! 🚀\nCheck out our documentation at https://docs.novu.co',
    `
    font-size: 16px;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 700;
    `
  );
};
