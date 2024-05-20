const fetch = require('node-fetch');

function left_align(handle, len) {
    if (handle.length >= len) {
        return handle.substring(0, len);
    }
    handle = " " + handle;
    while (handle.length < len) {
        handle += " ";
    }
    return handle;
}

const MAX_PRACTICE = 100;
const MAX_CONTEST = 800;

async function get_progress(handles)
{
    var url = `https://codeforces.com/api/user.status?handle=`;
    var contest_url = ` https://codeforces.com/api/contest.standings?contestId=`;

    // Date things
    var start = new Date();
    start.setMonth(start.getMonth() - 2);
    start.setHours(0, 0, 0, 0);

    
    // console.log(json_resp);
    var progress_data = {};
    for(var x=0; x<handles.length; x++){
        progress_data[handles[x]] = {contest: {}, practice: 0};
    }

    var contest = {};
    var cs = new Set();
    var j = 0;
    while(j < handles.length){

        var json_resp = null;
        try  {
            var resp = await fetch(url + (handles[j]));
            json_resp = await resp.json();
            if (json_resp.status != "OK") {
                console.log("Error: " + json_resp.comment);
                return null;
            }
        } catch (e) {
            console.log("Error: " + e);
            return null;
        }

        var s = new Set();
        var practice =  Array.from(Array(13), () => new Array(32));

        for(var p=0; p<13; p++){
            for(var q=0; q<32; q++){
                practice[p][q] = 0;
            }
        }

        console.log(json_resp.result.length);
        for (var i = 0; i < json_resp.result.length; i++) {
            var r = json_resp.result[i];
            var d = new Date(0);
            d.setUTCSeconds(r.creationTimeSeconds);
            if (d < start) continue;
            if (r.verdict == "OK"){
                var x = r.problem.contestId+r.problem.index;
                if (s.has(x)){
                    continue;
                }
                s.add(x);

                var p = 1200;
                if ((r.author.participantType == "CONTESTANT") || (r.author.participantType == "OUT_OF_COMPETITION")){

                    if (cs.has(r.problem.contestId)) continue;
                    cs.add(r.problem.contestId);

                    console.log(r.problem.contestId);

                    // if (r.problem.rating){
                    //     p = r.problem.rating;
                    // }
                    // if(contest.hasOwnProperty(r.problem.contestId)){
                    //     contest[r.problem.contestId] += (p/10);
                    // }
                    // else{
                    //     contest[r.problem.contestId] = (p/10);
                    // }
                    var json_resp2 = null;
                    try  {
                        var resp2 = await fetch(contest_url + r.problem.contestId);
                        json_resp2 = await resp2.json();
                        if (json_resp2.status != "OK") {
                            console.log("Error: " + json_resp2.comment);
                            return null;
                        }
                    } catch (e) {
                        console.log("Error: " + e);
                        return null;
                    }

                    var rows = json_resp2.result.rows;
                    var rank = 0;
                    var total = 0;
                    for (var y=0; y < rows.length; y++){
                        var R = rows[y].party.participantType;
                        if ((R=="CONTESTANT") || (R=="OUT_OF_COMPETITION")){
                            total += 1;
                        }
                    }
                    for (var y=0; y < rows.length; y++){
                        var R = rows[y].party;
                        if ((R.participantType=="CONTESTANT") || (R.participantType=="OUT_OF_COMPETITION")){
                            
                            for (var z=0; z < R.members.length; z++){
                                if(handles.includes(R.members[z].handle)){
                                    progress_data[R.members[z].handle]['contest'][r.problem.contestId] = parseInt((MAX_CONTEST*(total-rows[y].rank))/total);
                                }
                            }

                        }
                    }
                }
                else{
                    if (r.problem.rating){
                        p = r.problem.rating;
                    }
                    practice[d.getMonth()][d.getDate()] += (p/100);
                }
            }
        }

        var practice_points = 0;
        for(var p=0; p<13; p++){
            for(var q=0; q<32; q++){
                if (practice[p][q] > MAX_PRACTICE){
                    practice_points += MAX_PRACTICE;
                }
                else{
                    practice_points += practice[p][q];
                }
            }
        }
        progress_data[handles[j]]['practice'] = practice_points;
        j++;
    }

    toReturn = {}
    for (var i=0; i < handles.length; i++){
        var h = handles[i];
        var data = {};
        var pts = 0;
        data['session'] = 0;
        data['practice'] = progress_data[handles[i]]['practice'];
        let arr = Object.values(progress_data[handles[i]]['contest']).sort((a,b) => (b-a));
        for(var j=0; j < Math.min(5, arr.length); j++){
            pts += arr[j];
        }
        data['contest'] = pts;
        data['total'] = data['session'] + data['practice'] + data['contest'];
        toReturn[handles[i]] = data;
    }

    return toReturn;
}

async function check(handle) {
    var progress = await get_progress(handle);
    var handles = Object.keys(progress);
    handles.sort((a,b) => progress[b]['total'] - progress[a]['total']);

    var reply = "*Progress of handles in the group:*\n\n\n```";
    reply += "       Handle       | Points | Divison (SPC)\n";
    reply += "==========================================================\n";
    for (var i = 0; i < handles.length; i++) {
        var handle = handles[i];
        var logo = "⚪";
        if(i==0) logo = "🥇";
        if(i==1) logo = "🥈";
        if(i==2) logo = "🥉";
        var tot = progress[handles[i]]['total'];
        var sess = progress[handles[i]]['session'];
        var prac = progress[handles[i]]['practice'];
        var cont = progress[handles[i]]['contest'];
        reply += `${logo}${left_align(handle, 18)}|  ${tot} | ${sess}+${prac}+${cont} \n`;
    }
    reply += "=============================```";
    console.log(reply);
}

check(["hetnil04", "OverRancid", "shubham6105", "rainboy", "skhan_org", "jaglike_makkar", "manikgg", "Navvi03"]);