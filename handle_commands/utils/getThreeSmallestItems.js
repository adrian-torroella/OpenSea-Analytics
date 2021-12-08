module.exports = (prices, traits, requiredTrait) => {
    let minOneValue = Infinity;
    let minOneKey = null;
    let minTwoValue = Infinity;
    let minTwoKey = null;
    let minThreeValue = Infinity;
    let minThreeKey = null;
    for (const [key, value] of Object.entries(prices).filter(([key, value]) => Object.values(traits[key]).includes(requiredTrait))) {
        if (value < minOneValue){
            minThreeValue = minTwoValue;
            minThreeKey = minTwoKey;
            minTwoValue = minOneValue;
            minTwoKey = minOneKey;
            minOneValue = value;
            minOneKey = key;
        }
 
        else if (value < minTwoValue){
            minThreeValue = minTwoValue;
            minThreeKey = minTwoKey;
            minTwoValue = value;
            minTwoKey = key;
        }
 
        else if (value < minThreeValue){
            minThreeValue = value;
            minThreeKey = key;
        }
    }
    return [`${minOneKey}:${minOneValue}`, `${minTwoKey}:${minTwoValue}`, `${minThreeKey}:${minThreeValue}`]
}
