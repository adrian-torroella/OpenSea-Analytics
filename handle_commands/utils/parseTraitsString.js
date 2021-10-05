module.exports = traitsString => {
    if(traitsString.includes(':')){
        const resultTraits = {
            pairs: true,
        };
        const traitsPairs = traitsString.toLowerCase().split(';').map(traitPair => traitPair.trim());
        for(const traitPair of traitsPairs){
            const [traitName, traitValue] = traitPair.split(':').map(traitVariable => traitVariable.trim()).filter(trait => trait.length !== 0);
            if(resultTraits.hasOwnProperty(traitName))
                resultTraits[traitName].push(traitValue)
            else
                resultTraits[traitName] = [traitValue];
        }
        return resultTraits;
    }
    else{
        const resultTraits = {
            pairs: false,
        };
        const traits = traitsString.toLowerCase().split(';').map(trait => trait.trim()).filter(trait => trait.length !== 0);
        for(const trait of traits){
            resultTraits[trait] = null;
        }
        return resultTraits;
    }
};
