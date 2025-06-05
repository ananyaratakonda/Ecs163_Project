# Ecs163 Project: 2024 Summer Paris Olympics
## Team 3 - Maggie Feng, Ananya Ratakonda, Amalia Perez, Harmanpreet Kaur, and Swati Iyer

### Run the code 
1. Go to the terminal and enter: 
```
git clone https://github.com/ananyaratakonda/Ecs163_Project.git
```
2. Then please open the **`index.html`** with Live Server

### Project Description:  
This project is an interactive data visualization dashboard that enables users to explore the 2024 Olympics data through a world heatmap. By clicking on a country, further information is displayed via a Sankey diagram and treemap chart. The Sankey diagram provides a medal breakdown of Olympic disciplines and the treemap chart provides a hierarchical ranking of disciplines. We hope this visual tool is intuitive and helps in understanding the complex data of the Olympics.  

The dataset we used can be found here: https://www.kaggle.com/datasets/piterfm/paris-2024-olympic-summer-games?select=medals_total.csv
### Project Layout:  
Our Final and Main visualization can be found on the main branch. The layout can be found inside of **`index.html`** w, and **`main.js`** was where we used D3.js to create the visualizations and add functionality to them. **`styles.css`** is where the styling can be found. The **`dataset`** folder, consists of 2 datasets that we used to implement this project: **`medals.csv`** and **`medals_total.csv`**

Additionally we have these branches that we used to work on this project: 

**Branch: interactions**  
This branch was not the main script for coding the visualizations. This branch integrated the different branches of the original world map, Sankey diagram, and treemap chart. This branch connects all the charts, correcting the spacing, transitions, and interactions. After clicking on a country, the sidebar will display by default a Sankey diagram of the top 10 sports with medal distributions. The user can interact with the dropdown and change to select the treemap chart. This is completed by the "drawSankey" and "drawTreemap" functions. The map and charts will update as the user clicks between the different charts and countries. However, if there is not enough medal data about a country, a message will appear stating there is not enough sufficient data to visualize the other charts. Additionally, the user can hover over any of the visualizations and gather more medal information via the tooltip implementation.

**Branch: sankey**  
To implement the Sankey chart visualization, the branch includes a function called “drawSankey.” When a country on the world map is clicked on, that country’s name will then be passed as an argument into the drawSankey function. This function will then filter the data to only contain medal information relevant to this country. Furthermore, this will allow the function to identify the top 10 disciplines that this country has won the most medals in, and visualize them in the Sankey chart. To visualize these disciplines in the sankey chart, each path is linked from a medal type to its designated discipline. In order to enhance usability, each path is colored gold, bronze, or silver, to signify which medal was won. Also, tooltip and hover functionality were added to help users easily identify more detailed information about how many medals were won per discipline.

**Branch: treemap**   
This branch contains the code for the original Tree Map, that uses the dataset: **`medals.csv`** to create a basic Tree Map of the number of medals top 10 sport disciplines got per country. This code focused on just America but later was changed to whatever country was chosen by the user. Additionally a toolkit was implemented so the user can hover over the Tree Map to learn how many medals each sport got. The color scheme was later changed to blue, so the darker the color means more the number of medals, the same color means the same amount of medals. The larger the area also means more medals. 

**Branch: WorldMap**  

