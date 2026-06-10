#include <iostream>
#include <vector>
using namespace std;
/*----------------------------------------------------------
                SOLVE  3:  Moving zero
------------------------------------------------------------*/

int main()
{
    vector<int> nums = {0, 1, 0, 3, 12, 0, 14};
    // vector<int> copy_nums = {0, 0, 0, 0, 0};
    int left = 0;

    for (int right = 0; right < nums.size(); right++)
    {
        if (nums[right] != 0)
        {
            int temp = nums[left];
            nums[left] = nums[right];
            // then I need to manually zero rest of the index.
            nums[right] = temp;
            left++;
        }
    }

    // cout << "[";

    for (int i = 0; i < nums.size(); ++i)
    {
        cout << nums[i] << " ,";
        // if (i < nums.size() - 1)
        //     cout << ",";
    }

    // cout << "]";

    return 0;
}

/*----------------------------------------------------------
    SOLVE 2 :  Manually making zero instead of moving zeros. ( This failed in the test case : While input is : [1])
------------------------------------------------------------*/

/*
int main()
{
    vector<int> nums = {0, 1, 0, 3, 12, 0, 14};
    // vector<int> copy_nums = {0, 0, 0, 0, 0};
    int left = 0;

    for (int right = 0; right < nums.size(); right++)
    {
        if (nums[right] != 0)
        {

            nums[left] = nums[right];
            // then I need to manually zero rest of the index.
            nums[right] = 0;
            left++;
        }
    }

    // cout << "[";

    for (int i = 0; i < nums.size(); ++i)
    {
        cout << nums[i] << " ,";
        // if (i < nums.size() - 1)
        //     cout << ",";
    }

    // cout << "]";

    return 0;
}

*/

/*----------------------------------------------------------
                SOLVE 1:  Taking extra space
------------------------------------------------------------*/
/*
int main()
{
    vector<int> nums = {0, 1, 0, 3, 12, 0, 14};
    // vector<int> copy_nums = {0, 0, 0, 0, 0};
    vector<int> copy_nums(nums.size(), 0);
    int flag = 0;

    for (int i = 0; i < nums.size(); i++)
    {
        if (nums[i] != 0)
        {
            copy_nums[flag] = nums[i];
            flag++;
        }
    }

    cout << "[";

    for (size_t i = 0; i < copy_nums.size(); ++i)
    {
        cout << copy_nums[i];
        if (i < copy_nums.size() - 1)
            cout << ",";
    }

    cout << "]";
}
*/