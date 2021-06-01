export default function taskManager(tasks: Array<() => Promise<void>>, maxConcurrentTasks: number): Promise<any[]> {
  return new Promise(function(resolve, reject) {
    const origLength = tasks.length;
    const returnValues = Array(origLength);
    const remainingTasks = tasks.slice();
    let currentlyRunningTasks = 0;

    const startNewTask = function() {
      //Exit if we completed all tasks
      if (remainingTasks.length === 0) {
        if (currentlyRunningTasks === 0) {
          return resolve(returnValues);
        }
      } else {
        //If there is at least one task left, complete it
        const curTaskIndex = origLength - remainingTasks.length;
        const curTask = remainingTasks.shift() as () => Promise<void>;
        currentlyRunningTasks += 1;
        curTask().then(function(...result) {
          returnValues[curTaskIndex] = result;
          currentlyRunningTasks -= 1;
          return startNewTask();
        }).catch(function(error) {
          reject(error);
        });
      }
    };

    for (let i = 0; i < maxConcurrentTasks; i += 1) {
      startNewTask();
    }
  });
}
