## Activity 1: Find dataset

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

## Activity 2: Task Definition

The goal of tihs project is to visually explore potential relationships between patient health indicators and the presence of heart disease. The following analytical questions guide the visualization design and interaction logic.

- **Task 1: How does the likelihood of heart disease vary across different age groups?**

    The idea we propose for this is to have a scatterplot or histogram of the columns `age` vs. `target` with some kind of highlighting effect to see affected vs. non-affected groups

- **Task 2: Is there a relationship between cholesterol level and resting blood preassure, and does this relationship differ between patients with and without heart disease?**

    We could use column `chol` and `trestbps` in order to visualize a scatterplot against the `target` column which is the disease presence. This would be interesting because cholesterol and blood preassure are pretty common contributors to heart health risks.

- **Task 3: Do men and women show different patterns of heart disease prevelance?**

    Since the data defines which patient is male and female through the `sex` column we could create a bar chart showing the proportion of patients with and without disease.

- **Task 4: Which chest pain type are most commonly associated with heart disease**

    The `cp` column is an ordinal variable that describes the type of chest pain. We were thinking of creating a color coded heatmap that compares chest pain type vs. heart disease outcomes. We think that this could make for an indicator of the severity of the heart disease or diagnostic value.

- **Task 5: How does exercise-induced angina or maximum heart rate acheived relate to the likelihood of heart disesae?**

    Using exercise performance indicators we can get insights the stress tolerance of the heart by visualizing a scatterplot between `thalach` and `age` and then use `exang` and `target` to give color coding or shape/size to the scatterplot.