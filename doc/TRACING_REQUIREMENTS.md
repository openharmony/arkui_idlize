Requirements collection for tracing functionality

Repo owner role
As repository owner I want to know which d.ts items was generated (file path, item parent, item name) so that I manage generated API
As repository owner I want to see generation tracability across all languages supported by generator (or selected by me) to manage API consistancy for various consumers
As repository owner I want exact match between d.ts items and generated items to easy understanding of usage and documentation translation
As repository owner I want to see which repository items was not generated and by which reason (file not scanned, blacklisted, generation error and so on) to manage API consistancy
As repository owner I want to see which generated items was added manually so that I can control repository API usage
As repository owner I want to see which generated items are covered by tests so that I can plan engineering activities and control quality
As repository owner I want to see which generated API tests are passed and which is not so that I can plan engineering activities and control quality
As repository owner I want to keep history of generations depending on API version or releae version so that I can track API evolution and progress

App owner role
1. As an app owner I want to compare list of app API calls with the list of repository API's so that I can manage application transition
2. As an app owner I want to see which API calls is not supported by repository and how to replace missed so I can adopt my appication
3. As an app owner I want to see the quality status of repository API's to make sure my application stability
4. As an app owner I want to see which repository API's used by my application are deprecated and what is an alternative so that  I can adopt my application
5. As an app owner I want to check my app API calls against API generation so that I can manage impact to my app

IDLIzer owner role
1. As a tool owner I want to check if new generation will broke compatibility with previous one and where exactly to avoid impact on users
2. As a tool owner I want to check if new generation impacts particular application code so that I can avoid compatibility issue and manage positive effect of generation