const path = require('path');
const fs = require('fs');

module.exports = async (enteredCollection, collectionTraits, requiredTraits) => {
    const completed = [];
    const id = Number(Date.now());
    if(requiredTraits.pairs){
        for(const tokenId of Object.keys(collectionTraits)){
            const traitsFound = [];
            for(const traitName of Object.keys(collectionTraits[tokenId])){
                const traitValue = collectionTraits[tokenId][traitName];
                if(requiredTraits.hasOwnProperty(traitName) && requiredTraits[traitName].includes(traitValue))
                    traitsFound.push(`${traitName}:${traitValue}`);
            }
            traitsFound.sort((a, b) => {
                const sortingCriteria = a.split(':')[0].localeCompare(b.split(':')[0]);
                if(sortingCriteria !== 0)
                    return sortingCriteria;
                return a.split(':')[1].localeCompare(b.split(':')[1]);
            });
            if(traitsFound.length !== 0)
                completed.push(fs.promises.appendFile(path.join('.', `${enteredCollection}-${id}.csv`), `${enteredCollection}, ${tokenId}, ${traitsFound.length}, ${traitsFound.reduce((acc, traitFound) => `${acc} ${traitFound}`, '')}\n`));
        }
        await Promise.all(completed);
    }
    else{
        for(const tokenId of Object.keys(collectionTraits)){
            const traitsFound = [];
            for(const traitName of Object.keys(collectionTraits[tokenId])){
                const traitValue = collectionTraits[tokenId][traitName];
                if(requiredTraits.hasOwnProperty(traitValue))
                    traitsFound.push(traitValue);
            }
            traitsFound.sort((a, b) => a.localeCompare(b));
            if(traitsFound.length !== 0)
                completed.push(fs.promises.appendFile(path.join('.', `${enteredCollection}-${id}.csv`), `${enteredCollection}, ${tokenId}, ${traitsFound.length}, ${traitsFound.reduce((acc, traitFound) => `${acc} ${traitFound}`, '')}\n`));
        }
        await Promise.all(completed);
    }
    return id;
};