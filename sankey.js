const width = window.innerWidth;
const height = window.innerHeight;

//sankey chart dimensions
let sankeyLeft = 200, sankeyTop = 20;
let sankeyMargin = {top: 10, right: 30, bottom: 30, left: 60},
    sankeyWidth = (width / 2) - sankeyMargin.left - sankeyMargin.right - 20,
    sankeyHeight = height - 50;

const { sankey, sankeyLinkHorizontal } = d3;
d3.csv("dataset/medals.csv").then(rawData =>{
    console.log("rawData", rawData);

    function makeSankey(countryName, rawData){

        const color = d3.scaleOrdinal()
            .domain(["Gold Medal", "Silver Medal", "Bronze Medal"])
            .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

        const sankeygraph = sankey()
            .nodeWidth(20)
            .nodePadding(10)
            .extent([[0, 0], [sankeyWidth, sankeyHeight]]);

        const nodesSet = new Set();
        const linkCounts = {};

        const country = rawData.filter(d => d.country === countryName);

        const countDisciplines = d3.rollups(
            country, 
            v => v.length, 
            d => d.discipline
        );

        const top10 = new Set(
            countDisciplines
                .sort((a, b) => d3.descending(a[1], b[1]))
                .slice(0, 10)
                .map(d => d[0])
        );

        country.forEach(d => {
            if (top10.has(d.discipline)) {
                const source = d.discipline;
                const target = d.medal_type;
                nodesSet.add(source);
                nodesSet.add(target);   

                const key = `${source}->${target}`;
                linkCounts[key] = (linkCounts[key] || 0) + 1;
            }
        });

        const nodes = Array.from(nodesSet).map(name => ({ name }));
        const nameToIndex = Object.fromEntries(nodes.map((d, i) => [d.name, i]));

        const links = Object.entries(linkCounts).map(([key, value]) => {
            const [src, tgt] = key.split("->");
            return {
                source: nameToIndex[src],
                target: nameToIndex[tgt],
                value: value
            };
        });

        const graph = sankeygraph({
            nodes: nodes.map(d => Object.assign({}, d)),
            links: links
        });

        const svg = d3.select("#svg")
            .attr("width", width)
            .attr("height", height);

        svg.selectAll("*").remove();

        const sankeyGroup = svg.append("g")
            .attr("transform", `translate(${sankeyLeft}, ${sankeyTop})`);

        sankeyGroup.append("g")
            .attr("fill", "none")
            .selectAll("path")
            .data(graph.links)
            .join("path")
            .attr("d", sankeyLinkHorizontal())
            .attr("stroke-width", d => Math.max(1, d.width))
            .attr("stroke", d => color(d.target.name))
            .attr("opacity", 0.7)
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                console.log("clicked on", d.source.name, "->", d.target.name);
            });

        const node = sankeyGroup.append("g")
            .selectAll("rect")
            .data(graph.nodes)
            .join("g")

        node.append("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", d => color(d.name) || "#888")
            .attr("stroke", "#000");

        node.append("text")
            .attr("x", d => d.x0 - 6)
            .attr("y", d => (d.y0 + d.y1) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(d => d.name);

    }
    

    makeSankey("Italy", rawData);



    
});