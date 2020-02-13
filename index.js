const fs = require('fs');
const axios = require('axios').default;
const inquirer = require('inquirer');
const pdf = require('html-pdf');
const jsdom = require("jsdom");
const { JSDOM }  = jsdom;

const linkIds = new Set(["loc","prof","blog"]);
const imgId = new Set(["prof_img"]);

const questions = [
    {
        type: 'input',
        message: 'Enter a GitHub user name.',
        name: 'userName'
    },
    {
        type: 'input',
        message: 'What is your favorite color?',
        name: 'color'
    }
];

async function getInputs(){
    let res = await inquirer.prompt(questions).then(function(response){
        //console.log(response);
        return response;
    });
    return res;
}

async function queryGithub(userName) {
    // get user data
    let response;
    try {
      const queryUrl = `https://api.github.com/users/${userName}`;
      response = await axios.get(queryUrl);
      //console.log(response);
      //return response;
    } catch (error) {
      console.error(error);
    }

    // get user starred data
    try {
        const queryUrl = `https://api.github.com/users/${userName}/starred`;
        const starResponse = await axios.get(queryUrl);
        //console.log(starResponse);
        //console.log(starResponse.data);
        return {...response.data, num_stars: starResponse.data.length};
      } catch (error) {
        console.error(error);
      }
}

function editHtmlDoc(filePath,replaceData){
    const outFilePath = "index2.html";
    fs.readFile(filePath, 'utf8', function(err, data) {
        if (err) throw err;
        //console.log(data);
        const dom = new JSDOM(data);
        const document = dom.window.document;
        var window = document.defaultView;
        // set up jQuery
        var $ = require('jquery')(window);
        const bgColor = replaceData.color;
        
        // do all the things
        for (let [key, value] of Object.entries(replaceData)){
            if (key !== "color"){
                if (linkIds.has(key))
                    $(`#${key}`).attr("href",value);
                else if (imgId.has(key))
                    $(`#${key}`).attr("src",value);
                else
                    $(`#${key}`).text(value);
                //console.log(`#${key}`)
                //console.log($(`#${key}`).text());
            }
            else{
                // background color
                $(`#${key}`).css(`background-color`, value)
            }
        }

        // cleanup
        $(".jsdom").remove();

        // write new file
        //console.log( document.doctype.innerHTML + document.head.innerHTML + document.body.innerHTML);
        var output = `<!DOCTYPE html>\n<html lang="en">\n<head>${document.head.innerHTML}</head>\n<body style="background-color: ${bgColor}">${document.body.innerHTML}</body></html>`;

        fs.writeFile(outFilePath, output, function(err) {
            if (err) throw err;
            console.log(`Saved new html as ${outFilePath}`);
        });
    });
}

function generatePdf(user){
    var html = fs.readFileSync('./index2.html', 'utf8');
    var options = { format: 'Letter',
                    renderDelay: 2000,
                    base: "file:///C:/Users/austi/OneDrive/Desktop/School/Homeworks/Homework%208/Profile-Generator/" };
    
    pdf.create(html, options).toFile(`./profile-${user}.pdf`, function(err, res) {
    if (err) return console.log(err);
       console.log(`pdf generated as: ${res.filename}`); // { filename: '/app/businesscard.pdf' }
    });
}

async function main(){
    let inputs = await getInputs();
    //let bgColor="blue";
    //let userName = "austin-e-cox";
    let bgColor = inputs.color;
    let userName = inputs.userName;
    let ghd = await queryGithub(userName);
    //console.log(bgColor);
    //console.log(githubData);
    let minimalGithubData = {
        prof_img: ghd.avatar_url,
        user : ghd.name,
        loc : ghd.location,
        prof: ghd.html_url,
        blog: ghd.blog,
        bio: ghd.bio,
        num_pub_repos: ghd.public_repos,
        num_followers: ghd.followers,
        num_following: ghd.following,
        num_stars: ghd.num_stars
    }
    //console.log(minimalGithubData);//minimalGithubData);
    //mapsSearchLoc = minimalGithubData.loc.replace(" ","+")
    //https://www.google.com/maps/place/Seattle,+WA,+USA/
    const newLoc = `https://www.google.com/maps/place/${minimalGithubData.loc.replace(/ /g,"+")}`
    minimalGithubData.loc = `${newLoc}`;
    //console.log(`${minimalGithubData.loc.replace(/ /g,"+")}`)
    // generate new dict of all data for web page
    const myData = {...minimalGithubData, color: bgColor}
    // log data in file
    fs.writeFileSync("data.txt",JSON.stringify(myData,null,2));
    editHtmlDoc("index.html",myData);
    generatePdf(myData.user);
}

main()