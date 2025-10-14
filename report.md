## Activity 1

For this project, the dataset selected was the Heart disease dataset from the UCI machine learning repository. The dataset is from a peer reviewed medical study conducted in the cleveland clinic foundation as has been used in academic research and eductional contexts for cardiovascular risk analysis, which is basically makes it a heart-health dataset. This is why it meets the main requirements oof being real-world, reliable and academically relevant.

according to UCI's repo website It also has almost 900.000 views and 64 citations which also helps us as developers because it means that there is a lot of documentation and open-source experimenting already done with this dataset that we can use to validate what we have done a bit.

Link to the dataset: https://archive.ics.uci.edu/dataset/45/heart+disease

The Cleveland subset of the dataset contains 303 rows and 14 columns describing clinical and physicall attributes from examined pations such as age, sex, resting blood preassure, cholesterole level, type of chest pain, max heart rate and a diagnostic target variable indicating the presence of heart disease. This makes for a combination of continuous (cholesterlol), discrete (number of major vesels), nominal (sex) and ordinal (severity of chest pain) types of entries in the data.

The dataset is not in its raw and pure form out of the box and it is a bit modified to make it easier to developers to use but we did do some preprocessing anyways just to make sure it fits our specific project. we did the following:

1. converted file extension from `.data` to `.csv`
2. Added a descriptive header row that we grabbed from the dataset documentation
3. replaced "?" values with NaN and then removed the incomplete rows
4. converted all numerical attributes to float type to enable quantitative analysis
5. save the resulting dataset to `data/cleveland.csv`

## Activity 2