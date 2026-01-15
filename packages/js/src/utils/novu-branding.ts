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
    '%cThe Inbox is powered by Novu! 🔔\nhttps://novu.co',
    `
    font-size: 16px;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 700;
    `
  );
};
