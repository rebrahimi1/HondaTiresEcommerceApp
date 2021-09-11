module.exports.getDate = getDate;

function getDate() {
    const today = new Date();

    const options = {
        day: "numeric"
    };

    const day = today.toLocaleDateString("en-US", options);

    return day;
    

}